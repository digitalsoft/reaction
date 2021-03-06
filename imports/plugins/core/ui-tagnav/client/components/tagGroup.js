import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import update from "react/lib/update";
import TagGroupBody from "./tagGroupBody";
import TagGroupHeader from "./tagGroupHeader";
import { TagItem } from "/imports/plugins/core/ui/client/components/tags/";
import { TagHelpers } from "/imports/plugins/core/ui-tagnav/client/helpers";
import { getTagIds } from "/lib/selectors/tags";
import { Router } from "/client/api";

class TagGroup extends Component {
  constructor(props) {
    super(props);

    const { parentTag, tagsByKey, tagIds } = props.tagGroupProps;
    this.state = {
      suggestions: [],
      newTag: {
        name: ""
      },
      tagIds,
      parentTag,
      tagsByKey
    };
  }

  componentWillReceiveProps(nextProps) {
    const { parentTag, tagsByKey, tagIds } = nextProps.tagGroupProps;
    this.setState({ tagIds, parentTag, tagsByKey });
  }

  get tags() {
    if (this.props.editable) {
      return this.state.tagIds.map((tagId) => this.state.tagsByKey[tagId]);
    }

    return this.props.tagGroupProps.subTagGroups;
  }

  get className() {
    if (this.props.blank) {
      return "create";
    }
    return "";
  }

  handleGetSuggestions = (suggestionUpdateRequest) => {
    const suggestions = TagHelpers.updateSuggestions(
      suggestionUpdateRequest.value,
      { excludeTags: this.state.tagIds }
    );

    this.setState({ suggestions });
  }

  handleClearSuggestions = () => {
    this.setState({ suggestions: [] });
  }

  handleNewTagSave = (event, tag) => {
    if (this.props.onNewTagSave) {
      this.props.onNewTagSave(tag, this.props.tagGroupProps.parentTag);
      this.setState({
        newTag: { name: "" }
      });
    }
  }

  handleTagUpdate = (event, tag) => {
    const newState = update(this.state, {
      tagsByKey: {
        [tag._id]: {
          $set: tag
        }
      }
    });

    this.setState(newState);
  }

  handleNewTagUpdate = (event, tag) => { // updates blank tag state being edited
    this.setState({ newTag: tag });
  }

  tagGroupBodyProps = (tag) => {
    const subTagGroups = _.compact(TagHelpers.subTags(tag));
    const tagsByKey = {};

    if (Array.isArray(subTagGroups)) {
      for (const tagItem of subTagGroups) {
        tagsByKey[tagItem._id] = tagItem;
      }
    }

    return {
      parentTag: tag,
      tagsByKey: tagsByKey || {},
      tagIds: getTagIds({ tags: subTagGroups }) || [],
      subTagGroups
    };
  }

  renderTree(tags) {
    if (Array.isArray(tags)) {
      return tags.map((tag) => (
        <div className={`rui grouptag ${this.className}`} data-id={tag._id} key={tag._id}>
          <TagGroupHeader
            {...this.props}
            tag={tag}
            parentTag={this.state.parentTag}
            onTagRemove={this.props.onTagRemove}
          />
          <TagGroupBody
            {...this.props}
            tagGroupBodyProps={this.tagGroupBodyProps(tag)}
          />
        </div>
      ));
    }
  }

  render() {
    const slug = this.state.parentTag.slug;
    const url = Router.pathFor("tag", {
      hash: {
        slug: slug
      }
    });
    return (
      <div className="rui tagtree">
        <div className="header">
          <span className="title">{this.state.parentTag.name}</span>
          <a href={url}>View All <i className="fa fa-angle-right" /></a>
        </div>
        <div className="content">
          {this.renderTree(this.tags)}
          {this.props.editable &&
            <div className="rui grouptag create">
              <div className="header">
                <TagItem
                  blank={true}
                  tag={this.state.newTag}
                  key="newTagForm"
                  inputPlaceholder="Add Tag"
                  i18nKeyInputPlaceholder="tags.addTag"
                  suggestions={this.state.suggestions}
                  onClearSuggestions={this.handleClearSuggestions}
                  onGetSuggestions={this.handleGetSuggestions}
                  onTagInputBlur={this.handleNewTagSave}
                  onTagSave={this.handleNewTagSave}
                  onTagUpdate={this.handleNewTagUpdate}
                />
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
}

TagGroup.propTypes = {
  blank: PropTypes.bool,
  editable: PropTypes.bool,
  onNewTagSave: PropTypes.func,
  onTagRemove: PropTypes.func,
  tagGroupProps: PropTypes.object
};

export default TagGroup;
